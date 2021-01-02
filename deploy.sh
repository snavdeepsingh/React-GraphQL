#!/bin/bash

# in root of the folder run this  `chmod +x deploy.sh`
# in root of the folder run this  `./deploy.sh`

echo What should the version be?
read VERSION

docker build -t snavdeepsingh/react_graphql:$VERSION .
docker push snavdeepsingh/react_graphql:$VERSION .

ssh root@64.227.13.208 "docker pull snavdeepsingh/react_graphql:$VERSION && docker tag snavdeepsingh/react_graphql dokku/api:$VERSION && dokku deploy api $VERSION"