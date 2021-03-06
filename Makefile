.PHONY: deps build network test start stop clean

DOCKER=docker
IMAGE=jlabusch/wrms-dash-api
NAME=wrms-dash-api
NETWORK=wrms-dash-net
BUILD=$(shell ls ./wrms-dash-build-funcs/build.sh 2>/dev/null || ls ../wrms-dash-build-funcs/build.sh 2>/dev/null)
SHELL:=/bin/bash

deps:
	@test -n "$(BUILD)" || (echo 'wrms-dash-build-funcs not found; do you need "git submodule update --init"?'; false)
	@echo "Using $(BUILD)"

build: deps
	$(BUILD) build $(IMAGE)

network:
	$(BUILD) network create $(NETWORK)

start: network
	@if [ -z "$$GOOGLE_API_KEY" ]; then echo "WARNING: please export GOOGLE_API_KEY and restart."; fi
	$(DOCKER) run \
        --name $(NAME) \
        --detach  \
        --expose 80 \
        --env DEBUG \
        --env CONFIG \
        --env GOOGLE_API_KEY \
        --env ICINGA_BASIC_AUTH \
        --network $(NETWORK) \
        --volume /etc/localtime:/etc/localtime:ro \
        --rm \
        $(IMAGE) start
	$(DOCKER) logs -f $(NAME) &

test:
	@mkdir -p ./coverage
	$(DOCKER) run \
        -it \
        --env DEBUG \
        --env CONFIG \
        --env GOOGLE_API_KEY \
        --volume /etc/localtime:/etc/localtime:ro \
        --volume $$PWD/coverage:/opt/coverage \
        --volume $$PWD/lib:/opt/lib \
        --volume $$PWD/test:/opt/test \
        --rm \
        $(IMAGE) test

stop:
	$(DOCKER) stop $(NAME) || :

clean:
	@test -d ./coverage && $(DOCKER) run -it --rm -v $$PWD/coverage:/coverage alpine chown -R $$(id -u):$$(id -g) /coverage || :
	@rm -fr ./coverage
	$(BUILD) image delete $(IMAGE) || :

