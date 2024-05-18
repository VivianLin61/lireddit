echo What should the version be?
read VERSION

docker buildx create --use
docker buildx build --platform linux/amd64 --push -t vivianlin61/lireddit:$VERSION .
docker push vivianlin61/lireddit:$VERSION
ssh -i ~/.ssh/id_rsa root@134.209.38.244 "docker pull vivianlin61/lireddit:$VERSION && docker tag vivianlin61/lireddit:$VERSION dokku/lireddit-api:$VERSION && dokku deploy lireddit-api $VERSION"

