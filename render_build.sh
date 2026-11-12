#!/usr/bin/env bash
# exit on error
set -o errexit

pipenv install --deploy --system
pipenv run upgrade

