package com.numelixa.app
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
class NumelixaMessagingService:FirebaseMessagingService(){
 override fun onNewToken(token:String){super.onNewToken(token)}
 override fun onMessageReceived(message:RemoteMessage){super.onMessageReceived(message);val title=message.notification?.title?:message.data["title"]?:"Numelixa";val body=message.notification?.body?:message.data["body"]?:"You have a new Numelixa update";val manager=getSystemService(NotificationManager::class.java);if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(NotificationChannel("numelixa","Numelixa notifications",NotificationManager.IMPORTANCE_HIGH));val intent=Intent(this,MainActivity::class.java).apply{flags=Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP};val pi=PendingIntent.getActivity(this,0,intent,PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT);manager.notify(System.currentTimeMillis().toInt(),NotificationCompat.Builder(this,"numelixa").setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle(title).setContentText(body).setPriority(NotificationCompat.PRIORITY_HIGH).setAutoCancel(true).setContentIntent(pi).build())
 }
}
