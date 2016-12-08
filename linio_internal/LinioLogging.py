#!/usr/bin/python
import sys
import simpleDB
import time

sys.path.insert(0, '/usr/lib/python2.7/bridge/') 

from bridgeclient import BridgeClient as bridgeclient

prefix_path = "/mnt/sda1/deviceData/"

def read_all_device_data(bridge):
	data_ready = bridge.get("ready")
	while data_ready != "True":
		time.sleep(.2)
		data_ready = bridge.get("ready")
	num_devices = int(bridge.get("devices"))
	device_info = []
	device_data = []
	for index in range(num_devices):
		device_name = "device_" + str(index)
		device_info.append(bridge.get(device_name + "_info"))
		device_data.append(bridge.get(device_name + "_data"))
	timestamp = int(bridge.get("timestamp"))
	bridge.put("ready", "False")
	return (timestamp, device_info, device_data)

def log_device_data(device_info, device_data, db):
	for index in range(len(device_info)):
		# so the db is going to be an info -> simpleDB mapping
		if not device_info[index] in db:
			db[device_info[index]] = simpleDB.simpleDB()
		db[device_info[index]].log_data(device_data[index])

def write_to_disk(db):
	for device in db:
		text = db[device].gen_csv()
		with open(prefix_path + device + ".csv", 'w') as f:
			f.write(text)
		print text
	out = ""
	for i in range(len(db)):
		if i != 0:
			out += ', '
		out += db.keys(i)
	with open(prefix_path + "devices.csv", 'w') as f:
		f.write(out)

def main():

	bridgeConnection = bridgeclient()                         

	last_update = 0

	db = dict()

	while True:
		# read data from the bridge
		timestamp, device_info, device_data = read_all_device_data(bridgeConnection)
		print timestamp
		# if we have no new data, then we should continue
		# or should we? should we log blank data
		if last_update >= timestamp:
			continue
		else:
			last_update = timestamp
			log_device_data(device_info, device_data, db)
			write_to_disk(db)

if __name__ == '__main__':
	main()