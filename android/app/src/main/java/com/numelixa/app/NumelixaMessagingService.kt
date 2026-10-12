package com.numelixa.app
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
class NumelixaMessagingService:FirebaseMessagingService(){
 override fun onNewToken(token:String){super.onNewToken(token);val access=getSharedPreferences("numelixa",MODE_PRIVATE).getString("access_token",null)?:return;val body=JSONObject().put("token",token).put("platform","android").toString().toRequestBody("application/json".toMediaType());val req=Request.Builder().url("https://numelixa.com/api/push/register").header("Authorization","Bearer $access").post(body).build();OkHttpClient().newCall(req).enqueue(object:Callback{override fun onFailure(call:Call,e:java.io.IOException){};override fun onResponse(call:Call,response:Response){response.close()}})}
 override fun onMessageReceived(message:RemoteMessage){super.onMessageReceived(message);val title=message.notification?.title?:message.data["title"]?:"Numelixa";val body=message.notification?.body?:message.data["body"]?:"You have a new Numelixa update";val manager=getSystemService(NotificationManager::class.java);if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(NotificationChannel("numelixa","Numelixa notifications",NotificationManager.IMPORTANCE_HIGH));val intent=Intent(this,MainActivity::class.java).apply{flags=Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP};val pi=PendingIntent.getActivity(this,0,intent,PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT);manager.notify(System.currentTimeMillis().toInt(),NotificationCompat.Builder(this,"numelixa").setSmallIcon(com.numelixa.app.R.drawable.ic_numelixa).setContentTitle(title).setContentText(body).setPriority(NotificationCompat.PRIORITY_HIGH).setAutoCancel(true).setContentIntent(pi).build())}
}
