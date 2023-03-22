#!/bin/bash

set -e
REGISTRY=
IMAGE='fshare'

if ! [ -n "${TAG}" ]
then
    [[ -n "$1" ]] && { 
        TAG="${1}"
    } || {
        TAG=latest
    }
fi
export IMAGE="${REGISTRY}/${IMAGE}:${TAG}"
export TAG=$TAG

docker build . -t "${IMAGE}"
docker push "${IMAGE}"
kubectl apply -f ./k8s/fs-pvc.yaml
kubectl create configmap fshare-config --from-file=./k8s/config.json\
    --dry-run=client --output yaml > ./k8s/fshare-config.yaml
kubectl apply -f ./k8s/fshare-config.yaml
envsubst < k8s/fshare.yaml | kubectl apply -f -