#include <Bridge.h>
#include <Wire.h>
#include <SparkFun_Si7021_Breakout_Library.h>
#include <SoftwareSerial.h>
#include <Xbee_device_data_struct.h>


device_db devices;
String data = "";
int t = 0; //timekeeping
SoftwareSerial XBee(8, 9); // RX, TX, 8 and 9 for YUN

void setup()
{
	XBee.begin(9600);
	Serial.begin(9600);
	Bridge.begin();

	// Setup device database
	setup_device_db(device_db);
}

void loop()
{
	/*
	What does a loop look like?
	1. check if there are any new devices
	2. query all devices for data
		2.1 once a device has been queries, write it to the bridge
	3. set the ready to read flag
	*/

	look_for_new_devices();

	read_and_store_sensor_data();

	send_commands_to_device(); 
	// TODO: figure out how these commands get here from the web inferface
}

String read_word_from_xbee() {
	while (XBee.available()){
		x = XBee.read();
		data += x;
	}
	if (data[data.length() - 1] == '\n'){
		send_data(data);
		data = "";
	}
}

void write_word_to_xbee(String word) {
	// TODO: write this
	exit(1);
}

void do_device_com(device* device) {
	/*
	What to do here:
	1. Ask for device
	2. wait for response
	3. ask for data
	4. read data
	5. store
	*/
	// TODO: wait for stuff to be ready then implement this
}

void read_and_store_sensor_data() {
	if (XBee.available()){
		String time_string = time_stamp();
		for (int i = 0; i < devices.num_devices; i++){
			do_device_com(devices.devices[i]);
		}
		Bridge.put("ready", "True");
	}
}

void look_for_new_devices() {
	// TODO: write this and figure out how it works
	exit(1);
}

void send_data(String data, int device_id, String time_string){
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
	Bridge.put("devices", (String)devices.num_devices);
	String tag_1 = "device_" + (String)device_id + "_info";
	String tag_2 = devices->devices[device_id]->description;
	String tag_3 = device_" + (String)device_id + "_data";

	if (data_valid){
		Bridge.put(tag_1, tag_2);
		Bridge.put("timestamp", time_string);
		Bridge.put(tag_3, data);
	}
}

String time_stamp(){
    t++;
    return (String)t;
}