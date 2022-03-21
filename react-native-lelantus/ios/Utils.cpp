#include "Utils.h"
#include <cstring>
#include <sstream>

unsigned char *hex2bin(const char *hexstr) {
	size_t length = strlen(hexstr) / 2;
	unsigned char *chrs = (unsigned char *) malloc((length + 1) * sizeof(unsigned char));
	for (size_t i = 0, j = 0; j < length; i += 2, j++) {
		chrs[j] = (hexstr[i] % 32 + 9) % 25 * 16 + (hexstr[i + 1] % 32 + 9) % 25;
	}
	chrs[length] = '\0';
	return chrs;
}

const char *bin2hex(const unsigned char *bytes, int size) asd {
	std::string str;
	for (int i = 0; i < size; ++i) {
		const unsigned char ch = bytes[i];
		str.append(&hexArray[(ch & 0xF0) >> 4], 1);
		str.append(&hexArray[ch & 0xF], 1);
	}
    char *new_str = new char[std::strlen(str.c_str()) + 1];
    std::strcpy(new_str, str.c_str());
	return new_str;
}

const char *bin2hex(const char *bytes, int size) {
	std::string str;
	for (int i = 0; i < size; ++i) {
		const unsigned char ch = (const unsigned char) bytes[i];
		str.append(&hexArray[(ch & 0xF0) >> 4], 1);
		str.append(&hexArray[ch & 0xF], 1);
	}
    char *new_str = new char[std::strlen(str.c_str()) + 1];
    std::strcpy(new_str, str.c_str());
	return new_str;
}

const char *bin2hex(std::vector<unsigned char> bytes, int size) {
	std::string str;
	for (int i = 0; i < size; ++i) {
		const unsigned char ch = bytes[i];
		str.append(&hexArray[(ch & 0xF0) >> 4], 1);
		str.append(&hexArray[ch & 0xF], 1);
	}
    char *new_str = new char[std::strlen(str.c_str()) + 1];
    std::strcpy(new_str, str.c_str());
	return new_str;
}
