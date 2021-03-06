import Ember from 'ember';
import config from './../../config/environment';

export default Ember.Controller.extend({

  needs: ['offer/transport_details'],

  canCancel: Ember.computed.alias('model.gogovanOrder.isCancelled'),
  driverContact: Ember.computed.alias('model.gogovanOrder.driverMobile'),
  gogovanContact: config.APP.GOGOVAN_CONTACT,
  isCancel: true,

  actions: {
    cancelBooking: function() {
      if(this.get('canCancel')){
        this.get('controllers.offer/transport_details').send('removeDelivery', this.get('model'));
      }
    }
  }
});
