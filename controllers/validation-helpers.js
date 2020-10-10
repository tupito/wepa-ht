// return true/false
function hasValidKeys(obj, validKeys) {
  let valid = true;
  Object.keys(obj).forEach((queryParam) => {
    if (!validKeys.includes(queryParam)) {
      valid = false;
    }
  });
  return valid;
}

// return string
function getUndefinedKey(arr, wantedKeys) {
  let undefinedKey = '';
  wantedKeys.forEach((key) => {
    if (!(key in arr)) {
      undefinedKey = key;
    }
  });
  return undefinedKey;
}

module.exports.hasValidKeys = hasValidKeys;
module.exports.getUndefinedKey = getUndefinedKey;
