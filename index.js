var Serialport = require('serialport')
var CRC = require('crc')
var crc = CRC.crc16modbus;
var process = require('process')

var sp;
if(process.argv[2]){
  sp = new Serialport(process.artv[2], {
//    parity: 'even', //default value of AZD-KX
    baudRate: 115200,
  })
  setup()
}

var inchunks = []
var lastCmd;

function setup(){
  sp.on('open', () => {
    console.log('port opened')
  })
  sp.on('data', d =>{
    console.log(d)
    inchunks.push(d)
    
    //attempt to verify packet completeness
    let packet = Buffer.concat(inchunks)
    if(packet.length < 5) return;  // shortest packet is error packet, len = 5
    if(packet[2] - packet[1] == 0x80) //exception packet
    {
      console.log(`Exception response ${lastCmd}: `,packet)
      lastCmd = '';
      inchunks = [];
      return
    }

    let b;
    switch(lastCmd){
      case 'ping':
        if(packet.length < 8) return;
        if(packet.slice(1,6).toString('hex') == '0800001234')
          console.log( `ID: ${packet[0]} respond online [ping].`)
        else
          console.log( 'Warning: unexpected response of ping', packet)
        break;
      case 'getAlarm':
        if(packet.length < 8) return; //wait for remaining data
        console.log( 'getAlarm returns: ',packet.slice(3, 7))
        break;
      case 'getDetectPos':
        if(packet.length < 7) return; //wait for remaining data
        b = packet.slice(3, 7)
        console.log( 'pos: ', b.readInt32BE())
        break;
      case 'getTemperature':
        if(packet.length < 15) return; //waith for remaining data
        b = packet.slice(3, 7)
        console.log( 'driver temperature: ', b.readInt32BE()/10 + '°C')

        b = packet.slice(7, 11)
        console.log( 'motor temperature: ', b.readInt32BE()/10 + '°C')

        b = packet.slice(11, 15)
        console.log( 'odometer: ', b.readInt32BE() * 100 + 'rev')
    }
    lastCmd = '';
    inchunks = [] // empty it
  })
}

function send(mbuf){
  //sp.write(mbuf);
  var outstr = mbuf.toString('hex') + '\n';
  console.log('sending: ' + outstr)
  sp.write(outstr);
}

function appendCrc16(inb){
  //inb = Buffer.from(inb)
  let c = crc(inb);
  let crb = Buffer.allocUnsafe(2)
  crb.writeUInt16LE(c)
  var outb = Buffer.concat( [inb, crb] )
  //console.log(outb)
  return outb 
}

function errLog(err){
  if(err)
    console.log(err)
}

function mkbuf(str){
  return Buffer.from(str.split(' ').join(''), 'hex')
}

// REPL commands /////////////////////////////////////////////////////////////
function connect(path){
  sp = new Serialport(path, {
    //parity: 'even', //default value of AZD-KX
    baudRate: 115200,
  })
  setup();
}

//ping if the controller of ID is online
function ping(id){
  let buf = mkbuf('01 08 00 00 12 34')
  buf[0] = id
  lastCmd = 'ping'
  send( appendCrc16(buf) , errLog)  
}

function clearAlarm(id){
  let buf = mkbuf('01 06 01 81 00 01')
  buf[0] = id
  lastCmd = 'clearAlarm'
  send( appendCrc16( buf ), errLog)  
}

function getAlarm(id){
  let buf = mkbuf('01 03 00 80 00 02')
  buf[0] = id
  lastCmd = 'getAlarm'
  send( appendCrc16(buf), errLog)  
}

function getDetectPos(id){
  let buf = mkbuf('01 03 00 cc 00 02')
  buf[0] = id
  lastCmd = 'getDetectPos'
  send( appendCrc16(buf), errLog)  
} 

function getTemperature(id){
  let buf = mkbuf('01 03 00 f8 00 06')
  buf[0] = id
  lastCmd = 'getTemperature'
  send( appendCrc16(buf), errLog)  
}

function rotate(id, steps, opts){
  let buf = mkbuf( '01 10 00 58 00 10 20' +
    '00 00 00 00' +
    '00 00 00 02' + //optype
    '00 00 21 34' + //default 8500 steps
    '00 00 07 d0' + //default speed 2000Hz
    '00 00 05 dc' + //start rate 1500Hz/sec
    '00 00 05 dc' + //stop rate 1500Hz/sec
    '00 00 03 e8' + //opcurrent 100%
    '00 00 00 01' )   //trigger=1; all data reflected

  buf[0] = id
  let btmp = Buffer.allocUnsafe(4);

  btmp.writeInt32BE(steps)
  btmp.copy(buf, 7+ 4*2)

  if(opts){
    if(opts.optype){
      btmp.writeInt32BE( opts.optype)
      btmp.copy(buf, 7+ 4*1);
    }
    if(opts.speed){
      btmp.writeInt32BE( opts.speed )      //Hz
      btmp.copy(buf, 7+4*3)
    }
    if(opts.rateStart){
      btmp.writeInt32BE( opts.rateStart) // Hz/sec
      btmp.copy(buf, 7+ 4*4) //copy to 8th byte
    }
    if(opts.rateStop){
      btmp.writeInt32BE( opts.rateStop) // Hz/sec
      btmp.copy(buf, 7+ 4*5) //copy to 8th byte
    }
    if(opts.opcurrent){
      btmp.writeInt32BE( opts.opcurrent )
      btmp.copy(buf, 7+ 4*6)
    }
  }
  lastCmd = 'rotate'
  send( appendCrc16(buf), errLog)  
}
