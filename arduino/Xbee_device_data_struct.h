#define INITIAL_DB_CAPACITY 10

struct device_db {
	int num_devices;
	int capacity;
	device** devices;
}

struct device {
	String device_name;
	String description;
	uint64_t hardware_id;
	API* device_api;
} ;

struct API {
	int num_commands;
	int capacity;
	API_command** commands;
} ;

struct API_command {
	String name;
	String type; // INT, STRING, or BOOL
};