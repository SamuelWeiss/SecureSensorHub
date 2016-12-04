#!/usr/bin/python
import sys
import simpleDB
import time

sys.path.insert(0, '/usr/lib/python2.7/bridge/') 

from bridgeclient import BridgeClient as bridgeclient

def read_all_device_data(bridge):
	data_ready = bridge.get("ready")
	while not data_ready:
		time.sleep(.2)
		data_ready = bridge.get("ready")
	bridge.set("ready", False)
	num_devices = bridge.get("devices")
	device_info = []
	device_data = []
	for index in range(num_devices):
		device_name = "device_" + str(index)
		device_info.append(bridge.get(device_name + "_info"))
		device_data.append(bridge.get(device_name + "_data"))
	timestamp = bridge.get("timestamp")
	return (timestamp, device_info, device_data)

def log_device_data(device_info, device_data, db):
	for index in range(len(device_info)):
		# so the db is going to be an info -> simpleDB mapping
		if not device_info[index] in db:
			db[device_info[index]] = simpleDB()
		db[device_info[index]].log_data(device_data[index])

def write_to_disk(db):
	for device in db:
		text = db[device].gen_csv()
		with open(device + ".csv", 'w') as f:
			f.write(text)

def main():

	bridgeConnection = bridgeclient()                         

	last_update = 0

	db = simpleDB()

	while True:
		# read data from the bridge
		timestamp, device_info, device_data = read_all_device_data(bridgeConnection)

		# if we have no new data, then we should continue
		# or should we? should we log blank data
		if last_update >= timestamp:
			continue
		else:
			last_update = timestamp
			log_data(device_info, device_data, db)
			write_to_disk(db)

if __name__ == '__main__':
	main()