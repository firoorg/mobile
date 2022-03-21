#ifndef ORG_FIRO_LELANTUS_UTILS_H
#define ORG_FIRO_LELANTUS_UTILS_H

#include <vector>

char const hexArray[16] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd',
						   'e', 'f'};

unsigned char *hex2bin(const char *str);

const char *bin2hex(const unsigned char *bytes, int size);

const char *bin2hex(const char *bytes, int size);

const char *bin2hex(std::vector<unsigned char> bytes, int size);

#endif //ORG_FIRO_LELANTUS_UTILS_H
