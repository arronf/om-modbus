
#include <ArduinoRS485.h>

// convert hex string to binary buffer
void hex2bin(char *instr, char *out){
  uint8_t fb, sb;
  for( int i = 0; i < strlen(instr)/2; i++){
    fb = instr[i*2] <='9' ? instr[i*2] - '0' : (instr[i*2] - 'a' + 10);
    sb = instr[i*2 +1] <= '9' ? instr[i*2 +1] - '0' : (instr[i*2 +1] - 'a' + 10);
    out[i] = fb*16 + sb;
  }
}

// convert binary back to hex string
void bin2hex(uint8_t *inbuf, int len, uint8_t *res){
  for(int i=0;i<len;i++){
    sprintf(res+i*2, "%02x", inbuf[i]);
  }
  res[len*2] = 0;
}

void setup() {
  Serial.begin(115200);
  while (!Serial);

  RS485.begin(115200);

  // enable reception, can be disabled with: RS485.noReceive();
  RS485.receive();
}

char mbibuf[80];   //modbus input buffer
char mbobuf[80];
char srbuf[256];  //serial input buffer
int srptr = 0;

void loop() {
  if (RS485.available()) {
    int ch = RS485.read();
    //sprintf(mbibuf, "%x ", ch);
    Serial.print("[485]: ");
    Serial.println(ch);
  }
  
  if(Serial.available() > 0){
    int inb = Serial.read();
    if(inb == 0xa || inb == 0xd){
      srbuf[srptr] = 0x0;
      srptr = 0;
      Serial.print("start relaying packet: ");
      Serial.print(srbuf);
      Serial.println();

      RS485.noReceive();
      RS485.beginTransmission();
      hex2bin(srbuf, mbobuf);
      RS485.write(mbobuf, strlen(srbuf)/2);
      RS485.endTransmission();
      RS485.receive();
    }else{
      srbuf[srptr++] = inb;      
    }

    // example packet 050800001234ecf8
    // example packet 050300f8000645bd
  }
}
