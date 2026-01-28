#!/bin/bash

# Fix all route imports to use -admin controllers

# tracking-admin.js
sed -i "s/trackingController/trackingController-admin/g" src/routes/tracking-admin.js

# approval-admin.js  
sed -i "s/approvalController/approvalController-admin/g" src/routes/approval-admin.js

# akun-admin.js
sed -i "s/akunController/akunController-admin/g" src/routes/akun-admin.js

echo "All route imports fixed!"