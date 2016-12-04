#include <Bridge.h>
#include <Wire.h>
#include <SparkFun_Si7021_Breakout_Library.h>

int power = A0;
int ground = A1;
float humidity = 0;
float temperature = 0;
int i = -1;

Weather sensor;

void setup() {
  
  pinMode(power, OUTPUT);
  pinMode(ground, OUTPUT);
  digitalWrite(power, HIGH);
  digitalWrite(ground, LOW);
  Serial.begin(9600);
  Bridge.begin();
  sensor.begin();
}

void loop() {
  //while (!Serial.available());
  String time_string;
  String tempf;
  String RH;
  get_data();
  Serial.print("temperature: ");
  Serial.println(temperature);
  Serial.print("humidity: ");
  Serial.println(humidity);
  
  tempf = (String)temperature;
  RH = (String)humidity;
  Bridge.put("devices", "2");
  
  //  Device 0 : Temperature
  time_string = time_stamp();
  Bridge.put("device_0_info", "temperature");
  Bridge.put("timestamp", time_string);
  Bridge.put("device_0_data", tempf);

  //  Device 1 : Humidity
  Bridge.put("device_1_info", "humidity");
  Bridge.put("timestamp", time_string);
  Bridge.put("device_1_data", RH);
  
  Bridge.put("ready", "True");
  
  delay(5000);
}

void get_data(){
  temperature = sensor.getTempF();
  humidity = sensor.getRH();
}

String time_stamp(){
    i++;
    return (String)i;
}

