package com.numelixa.app
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
class NumelixaMessagingService: FirebaseMessagingService(){override fun onNewToken(token:String){/* POST token to authenticated Numelixa device-token endpoint */}override fun onMessageReceived(message:RemoteMessage){/* show local notification for SMS/order/payment events */}}
