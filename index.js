var Serialport = require('serialport')
var CRC = require('crc')
var crc = CRC.crc16modbus;

var sp = new Serialport('COM20', {
  parity: 'even',
  baudRate: 115200,
})

var inchunks = []
sp.on('data', d =>{
  console.log(d)
  inchunks.push(d)
  //try to verify
  if(inchunks.length > 1){
    let packet = Buffer.concat(inchunks)
    if( packet[1] == 0x08 && packet.slice(1,6).toString('hex') == '0800001234')
      console.log( `ID: ${packet[0]} respond online.`)
    else
      console.log( 'unknown packet: ', packet)
    inchunks = [] // empty it
  }
})

function appendCrc16(inb){
  inb = Buffer.from(inb)
  let c = crc(inb);
  let crb = Buffer.allocUnsafe(2)
  crb.writeUInt16LE(c)
  var outb = Buffer.concat( [inb, crb] )
  console.log(outb)
  return outb 
}
function errLog(err){
  if(err)
    console.log(err)
}
sp.on('open', () => {
  console.log('port opened')
  //sp.write( appendCrc16([0x02, 0x08, 0x00, 0x00, 0x12, 0x34]), errLog)  
})

function diagEcho(id){
  sp.write( appendCrc16([id, 0x08, 0x00, 0x00, 0x12, 0x34]), errLog)  
}
