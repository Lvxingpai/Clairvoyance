Template.services.helpers({
    services: function () {
        return config.db.Service.find({}).fetch();
    }
})

Template.services.onRendered(function () {
    $('.footable').footable();
})

Template.services.events({
    'click .glyphicon-bell': function () {
        // TODO 设置报警弹层
        // var self = this;
        // if (self.uploadLayer) {
        //   self.uploadLayer.show();
        // } else {
        var shareDialogInfo = {
            template: Template.alarmLayer,
            title: '服务的报警器设置',
            doc: {}
        };
        layerManager.alarmLayer = ReactiveModal.initDialog(shareDialogInfo);
        layerManager.alarmLayer.show();
        // }
    }
})