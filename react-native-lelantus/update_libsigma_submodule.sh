#!/bin/bash
if [ ! -d native-libs/liblelantus/src ]; then
    grep url .gitmodules | sed 's/.*= //' | while read url; do git clone $url native-libs/liblelantus; done
fi