/**
 * 定义Meteor.methods
 *
 * Created by zephyre on 9/19/15.
 */

Meteor.methods({
    /**
     * 检查注册时提供的token是否有效
     *
     * @param token
     * @returns {boolean}
     */
    "checkRegisterToken": function (token) {
        if (token == undefined) {
            return false;
        } else {
            return _.isNaN(parseInt(token));
        }
    }
});
