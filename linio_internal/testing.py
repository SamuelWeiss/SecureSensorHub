import simpleDB

myTest = simpleDB.simpleDB(10,3)

for i in range(1000):
	myTest.log_data(i)

t = myTest.gen_csv()

print t