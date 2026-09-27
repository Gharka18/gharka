import test from 'node:test';
import assert from 'node:assert/strict';
import {runSuite} from './suite.js';
for(const result of runSuite())test(result.name,()=>assert.ok(result.passed,result.error));
