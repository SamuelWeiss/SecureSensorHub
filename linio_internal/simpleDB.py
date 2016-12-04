import math

class simpleDB:
	data = [] # we'll do this
	counter = 0
	capacity = 10
	numDers = 3

	def __init__(self, cap = 10, numDerivatives = 3):
		self.capacity = cap
		self.numDers = numDerivatives
		self.data = [[] for _ in range(numDerivatives)]

	def log_data(self, measurement):
		for i in range(self.numDers):
			if self.counter % int(math.pow(self.capacity, i)) == 0:
				self.smart_insert(measurement, self.data[i])
		self.counter+=1

	def smart_insert(self, data, db):
		if len(db) >= self.capacity:
			#eject a value
			db.pop(-1)
		db.insert(0, data)

	def read_recent_data(self):
		return self.data

	def gen_csv(self):
		output = ""
		# for i in range(self.numDers):
		for derivative in self.data:
			output += "Data" #figure out something better to do here
			for entry in derivative:
				output += (', ' + str(entry))
			output += "\n"

		return output

