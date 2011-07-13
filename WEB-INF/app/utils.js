var {isUrlEncoded, mergeParameter, parseParameters} = require("ringo/utils/http");


exports.postParams = function(req) {
    var contentType = req.headers["content-type"],
        servletRequest = req.env.servletRequest,
        postParams = null;
    
    if (req.method === "POST" || req.method === "PUT") {
        var input,
            encoding = servletRequest.getCharacterEncoding() || "utf8";
        if (isUrlEncoded(contentType)) {
            postParams = {};
            input = req.input.read();
            var contentLength = parseInt(req.headers["content-length"]);
            if (!input.length && contentLength > 0) {
                // Entity body already consumed, ask servlet API for params
                // See ringo issues #70 and #130
                var map = servletRequest.getParameterMap();
                for (var entry in Iterator(map.entrySet())) {
                    var {key, value} = entry;
                    // value is a java string array
                    for each (var val in value) {
                        mergeParameter(postParams, key, val);
                    }
                }
            } else {
                parseParameters(input, postParams, encoding);
            }
        } else if (strings.startsWith(contentType, "application/json")) {
            input = req.input.read();
            postParams = JSON.parse(input.decodeToString(encoding));
        }
    }
    // query previous postParams property descriptor in case
    // this is a file upload
    if (!postParams && desc) {
        postParams = desc.get ? desc.get.apply(req) : desc.value;
    }
    return postParams;
}

