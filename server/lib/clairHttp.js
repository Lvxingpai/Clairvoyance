/**
 * Clairvoyance使用的HTTP方法封装
 * Created by zephyre on 9/19/15.
 */
ClairHttp = (function () {
    var Future = Npm.require('fibers/future');

    /**
     * 以GET形式, 访问urls列表, 并返回第一个成功的响应(Future形式).
     * @param urls
     * @param options
     * @param errback 错误回调函数, 用来处理出错的情况
     * @returns {*}
     */
    var clusteredHttpGet = function (urls, options, errback) {
        var future = new Future();

        // 改写callback
        var modCallback = function (error, result) {
            if (error) {
                // 挽救机制
                if (errback != undefined && errback(error, result).rescued) {
                    future.return(result);
                } else {
                    console.log("Error occured: " + error);
                    if (urls.length > 0) {
                        // 尝试新的服务端口
                        var url = urls.pop();
                        console.log("Try another url: " + url);
                        HTTP.get(url, options, modCallback);
                    } else {
                        console.log("Throwing: " + error);
                        future.throw(error);
                    }
                }
            } else {
                console.log("Success: " + result);
                future.return(result);
            }
        };

        var url = urls.pop();
        console.log("Fetching: " + url);
        HTTP.get(url, options, modCallback);

        return future;
    };

    return {
        "clusteredHttpGet": clusteredHttpGet
    };

})();
