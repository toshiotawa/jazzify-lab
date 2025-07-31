#!/bin/bash
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/: any/: unknown/g"
