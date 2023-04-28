#!/bin/bash

echo What should the version be?
read VERSION

docker build -t linvivian61/lireddit:$VERSION .
docker push linvivian61/lireddit:$VERSION
ssh root@64.227.13.208 "docker pull linvivian61/lireddit:$VERSION && docker tag linvivian61/lireddit:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"
