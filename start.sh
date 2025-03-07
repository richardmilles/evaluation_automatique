#!/bin/bash
echo "✅ PORT fourni par Railway = [$PORT]"
waitress-serve --listen=0.0.0.0:$PORT config.wsgi:application
