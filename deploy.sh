#!/bin/bash

echo What should the version be?
read VERSION

docker build -t vivianlin61/lireddit:$VERSION .
docker push vivianlin61/lireddit:$VERSION
ssh root@206.81.31.187 "docker pull vivianlin61/lireddit:$VERSION && docker tag vivianlin61/lireddit:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"
