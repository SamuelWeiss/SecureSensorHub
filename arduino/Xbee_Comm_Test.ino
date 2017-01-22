#include <Wire.h>
#include <SparkFun_Si7021_Breakout_Library.h>

/*****************************************************************
XBee_Serial_Passthrough.ino

Set up a software serial port to pass data between an XBee Shield
and the serial monitor.

Hardware Hookup:
  The XBee Shield makes all of the connections you'll need
  between Arduino and XBee. If you have the shield make
  sure the SWITCH IS IN THE "DLINE" POSITION. That will connect
  the XBee's DOUT and DIN pins to Arduino pins 2 and 3.

*****************************************************************/
// We'll use SoftwareSerial to communicate with the XBee:
#include <SoftwareSerial.h>
// XBee's DOUT (TX) is connected to pin 2 (Arduino's Software RX)
// XBee's DIN (RX) is connected to pin 3 (Arduino's Software TX)
SoftwareSerial XBee(A10, 3); // RX, TX, 8 and 9 for YUN
int power = A11;
int gnd = A12;
float temperature;
float humidity;
Weather sensor;


void setup()
{
  // Set up both ports at 9600 baud. This value is most important
  // for the XBee. Make sure the baud rate matches the config
  // setting of your XBee.
  pinMode(power, OUTPUT);
  pinMode(gnd, OUTPUT);
  digitalWrite(power, HIGH);
  digitalWrite(gnd, LOW);
  sensor.begin();
  XBee.begin(9600);
  //Serial.begin(9600);
}

void loop()
{
  get_data();

  String data = '$' + (String)temperature + '\n';
  
  for (int i = 0; i < data.length(); i++){
    XBee.write(data[i]);
  }
  
  delay(5000);
}

void get_data(){
  temperature = sensor.getTempF();
  humidity = sensor.getRH();
}

