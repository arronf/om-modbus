curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh &&
arduino-cli core update-index
arduino-cli board install arduino:samd:mkrzero
arduino-cli core install arduino:samd

