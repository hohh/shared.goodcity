import Ember from "ember";
import config from '../config/environment';
import AjaxPromise from '../utils/ajax-promise';

export default Ember.Service.extend({
  session: Ember.inject.service(),
  logger: Ember.inject.service(),
  messagesUtil: Ember.inject.service("messages"),

  appLoad: function () {
    if (!config.cordova.enabled) {
      return;
    }

    // Based off https://github.com/Telerik-Verified-Plugins/PushNotification/blob/master/Example/www/index.html

    var pushNotification, _this = this;

    function onDeviceReady() {
      pushNotification = window.plugins.pushNotification;
      if (device.platform == "android" || device.platform == "Android" || device.platform == "amazon-fireos") {
        var opts = {"senderID":config.cordova.GcmSenderId, "ecb":"onNotificationGCM"};
        pushNotification.register(successHandler, errorHandler, opts);
      } else if (device.platform === "iOS") {
        var opts = {"badge": "true", "sound": "true", "alert": "true", "ecb": "onNotificationAPN"};
        pushNotification.register(res => sendToken(res, "aps"), errorHandler, opts);
      } else if (device.platform === "windows") {
        var opts = {"ecb":"noop"};
        pushNotification.register(res => sendToken(res.uri, "wns"), errorHandler, opts);
        WinJS.Application.addEventListener("activated", window.onNotificationWindows, false);
      }
    }

    // handle APNS notifications for iOS
    window.onNotificationAPN = function(e) {
      if (e.foreground === "0") {
        return processTappedNotification(e);
      }

      if (e.badge) {
        pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, e.badge);
      }
    }

    // handle GCM notifications for Android
    window.onNotificationGCM = function(e) {
      switch (e.event) {
        case 'registered':
          if (e.regid.length > 0) {
            sendToken(e.regid, "gcm");
          }
          break;

        case 'message':
          if (e.foreground) {
            // handled by socket.io notification sent at same time (e.payload.message)
          }
          else {
            processTappedNotification(e.payload);
            // otherwise we were launched because the user touched a notification in the notification tray
          }
          break;

        case 'error':
          this.get("logger").error("notification error " + JSON.stringify(e));
          break;

        default:
          this.get("logger").error("unknown notification event " + JSON.stringify(e));
          break;
      }
    }

    // handle WNS notifications for WP8.1
    window.onNotificationWindows = function(e) {
      if (e.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
        processTappedNotification(JSON.parse(e.detail.arguments));
      }
    }

    window.noop = function() {}

    function sendToken(handle, platform) {
      return new AjaxPromise("/auth/register_device", "POST", _this.get("session.authToken"), {handle: handle, platform: platform});
    }

    function successHandler(result) {
    }

    function errorHandler(error) {
      _this.get("logger").error(error);
    }

    function processTappedNotification(payload) {
      var notifications = _this.container.lookup("controller:notifications");
      if (payload.category === "incoming_call") {
        notifications.acceptCall(payload);
      }
      notifications.setRoute(payload);
      notifications.transitionToRoute.apply(notifications, payload.route);
    }

    document.addEventListener('deviceready', onDeviceReady, true);
  }
});
