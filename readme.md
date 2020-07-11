# RS485 driver for Oriental Motor AZD-KX controller
T2T Inc.

## Usage
It's easy to test out motor functions in REPL mode. 

* `node` to enter node REPL
* `.load index.js` to load the script
* `connect(PATH)` to connect to the serial port; `/dev/ttyXXX` in Linux or `COM##` in Windows
* `ping(ID)` to ping the existance of the controller ID, ex `2`
* `getAlarm(ID)` to query alarm status
* `clearAlarm(ID)` to clear alarm from the controller.  It's necessary to make sure there's no unattended alarm in the controller so that it can be ready to receive commands
* `getTemperature(ID)` to query temperature and odometer of the motor
```
driver temperature:  38.8°C
motor temperature:  51.4°C
odometer:  2000rev
```

* `rotate(ID, SPEED, [options])` to issue rotate command
  * STEPS: number of steps to move; could be negative integer
  * options:
    * speed: number of steps in 1 sec; default 2000
    * rateStart: start speed slope/rate; default 1500Hz/sec
    * rateStop: stop speed slope/rate; default 1500Hz/sec
    * opcurrnet: opreation current; default 100%

