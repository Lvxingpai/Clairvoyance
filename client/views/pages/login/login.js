Template.login.events({
  'click #login': function(event, template) {
    event.preventDefault();

    var username = template.find('input[name=username]').value,
        password = template.find('input[name=password]').value;

    Meteor.loginWithPassword(username, password, function(error) {
      if (error) {
        alert('账号或者密码错误');
      } else {
        Router.go('dashboard1');
      }
    });
  },

});

Template.login.onRendered(function(){
  $.material.radio();
});