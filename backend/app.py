#!/usr/bin/env python3

from aws_cdk import core

from infrastructure.infrastructure_stack import InfrastructureStack


app = core.App()
InfrastructureStack(app, "backend")

app.synth()
