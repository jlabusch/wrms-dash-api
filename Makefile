.PHONY: deps build network test start stop clean

DOCKER=docker
IMAGE=jlabusch/wrms-dash-api
NAME=wrms-dash-api
CONFIG_VOL=wrms-dash-config-vol
NETWORK=wrms-dash-net
BUILD=$(shell ls ./wrms-dash-build-funcs/build.sh 2>/dev/null || ls ../wrms-dash-build-funcs/build.sh 2>/dev/null)
SHELL:=/bin/bash

deps:
	@test -n "$(BUILD)" || (echo 'wrms-dash-build-funcs not found; do you need "git submodule update --init"?'; false)
	@echo "Using $(BUILD)"
	@$(BUILD) volume exists $(CONFIG_VOL) || $(BUILD) error "Can't find docker volume $(CONFIG_VOL) - do you need to \"make config\" in wrms-dash?"

build: deps
	@mkdir -p ./config
	$(BUILD) cp alpine $(CONFIG_VOL) $$PWD/config /vol0/default.json /vol1/
	$(BUILD) build $(IMAGE)
	@rm -fr ./config

network:
	$(BUILD) network create $(NETWORK)

start: network
	$(DOCKER) run \
        --name $(NAME) \
        --detach  \
        --expose 80 \
        --env DEBUG \
        --env ICINGA_BASIC_AUTH \
        --network $(NETWORK) \
        --volume /etc/localtime:/etc/localtime:ro \
        --rm \
        $(IMAGE) start
	$(DOCKER) logs -f $(NAME) &

test:
	$(DOCKER) run \
        -it \
        --env DEBUG \
        --volume /etc/localtime:/etc/localtime:ro \
        --rm \
        $(IMAGE) test

stop:
	$(DOCKER) stop $(NAME)

clean:
	$(BUILD) image delete $(IMAGE) || :

