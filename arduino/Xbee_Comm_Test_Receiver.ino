#include <Bridge.h>
#include <Wire.h>
#include <SparkFun_Si7021_Breakout_Library.h>
#include <SoftwareSerial.h>

#define NUM_DEVICES 1

String data = "";
int t = 0; //timekeeping
SoftwareSerial XBee(8, 9); // RX, TX, 8 and 9 for YUN

void setup()
{
  XBee.begin(9600);
  Serial.begin(9600);
  Bridge.begin();
}

void loop()
{
  //String data = "";
  //String fixed_data = "";
  char x = x;
  if (XBee.available()){
    while (XBee.available()){
      x = XBee.read();
      data += x;
    }
    if (data[data.length() - 1] == '\n'){
      //Serial.print(data);
      send_data(data);
      data = "";
    }
  }
}

void send_data(String data){
  bool data_valid = false;
  String new_data = "";
  Serial.print(data);
  for (int i = 0; i < data.length() - 1; i++){
    if (data[i] == '$'){
      i++;
      data_valid = true;
    }
    if (data_valid){
      new_data += data[i];
    }
  }
  data = new_data;
  Serial.println(data);
  String time_string = time_stamp();
  Bridge.put("devices", (String)NUM_DEVICES);
  /* TODO: Change tags to be able to change dynamically based on the data 
   * string read in by the board. (Send certain tags over XBee such as 
   * the name of the data and possibly the device number. The latter 
   * would require two-way communication to be established). Everything   
   * is static for now.
   */
  String tag_1 = "device_0_info";
  String tag_2 = "temperature";
  String tag_3 = "device_0_data";
  
  if (data_valid){
    Bridge.put(tag_1, tag_2);
    Bridge.put("timestamp", time_string);
    Bridge.put(tag_3, data);
    Bridge.put("ready", "True");
  }
}

String time_stamp(){
    t++;
    return (String)t;
}

