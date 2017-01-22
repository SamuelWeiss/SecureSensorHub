#include <cstdint>
#include <stdlib.h>
#include <Xbee_device_data_struct.h>
/*
What data is relevant?

* device name
* device id -> requested from Xbee itself
* NO address or anything

* API
*/

void setup_device_db(device_db data) {
	data.num_devices = 0;
	data.capacity = INITIAL_DB_CAPACITY;
	data.devices = (device**)malloc(sizeof(device*) * data.capacity);
	// just making space for pointer
}

void expand_storage(device_db data) {
	data.capacity = data.capacity * 2;
	device** new_devices = (device**)malloc(sizeof(device*) * data.capacity);
	for (int i = 0; i < data.num_devices; i++) {
		new_devices[i] = data.devices[i];
	}
	free(data.devices);
	data.devices = new_devices;
}

void add_device_to_db(device_db data, device* new_device) {
	if (data.num_devices == data.capacity) {
		expand_storage(data);
	}
	data.devices[data.num_devices] = new_device;	
}