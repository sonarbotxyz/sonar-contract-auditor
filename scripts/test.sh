#!/bin/bash
# Test with a simple vulnerable ERC20 contract
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "pragma solidity ^0.8.0;\ncontract VulnerableToken {\n  mapping(address=>uint) public balances;\n  function withdraw() public {\n    uint bal = balances[msg.sender];\n    (bool sent,) = msg.sender.call{value: bal}(\"\");\n    require(sent);\n    balances[msg.sender] = 0;\n  }\n}"
  }'
