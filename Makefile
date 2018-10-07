.PHONY: build network start stop clean

DOCKER=docker
IMAGE=jlabusch/wrms-dash-api
NAME=wrms-dash-api
NETWORK=wrms-dash-net

build:
	$(DOCKER) build -t $(IMAGE) .

network:
	$(DOCKER) network list | grep -q $(NETWORK) || $(DOCKER) network create $(NETWORK)

start:
	$(DOCKER) run \
        --name $(NAME) \
        --detach  \
        --expose 80 \
        --env DEBUG \
        --env ICINGA_BASIC_AUTH \
        --network $(NETWORK) \
        --volume /etc/localtime:/etc/localtime:ro \
        --volume $$PWD/config/default.json:/opt/config/default.json:ro \
        --rm \
        $(IMAGE)
	$(DOCKER) logs -f $(NAME)

stop:
	$(DOCKER) stop $(NAME)

clean:
	$(DOCKER) rmi $(IMAGE) $$($(DOCKER) images --filter dangling=true -q)
