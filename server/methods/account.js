/**
 * 和账户系统相关的Meteor.methods
 *
 * Created by zephyre on 9/20/15.
 */

Meteor.methods({
    /**
     * 检查注册时提供的token是否有效
     *
     * @param token
     * @returns {boolean}
     */
    "account.checkSignUpToken": function (token) {
        if (token == undefined) {
            return false;
        } else {
            return _.isNaN(parseInt(token));
        }
    }
});
