package com.numelixa.app
import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
private const val API_BASE="https://numelixa.com"
private const val PREFS="numelixa"
private const val TOKEN="access_token"
class MainActivity:ComponentActivity(){
 private val permissionLauncher=registerForActivityResult(ActivityResultContracts.RequestPermission()){}
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);createNotificationChannel();if(Build.VERSION.SDK_INT>=33&&ContextCompat.checkSelfPermission(this,Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);setContent{NumelixaApp()}}
 private fun createNotificationChannel(){if(Build.VERSION.SDK_INT>=26){val c=NotificationChannel("numelixa","Numelixa notifications",NotificationManager.IMPORTANCE_HIGH).apply{description="SMS codes, orders and payment updates"};getSystemService(NotificationManager::class.java).createNotificationChannel(c)}}
 @Composable fun NumelixaApp(){var logged by remember{mutableStateOf(getSharedPreferences(PREFS,MODE_PRIVATE).getString(TOKEN,null)!=null)};var email by remember{mutableStateOf("")};var password by remember{mutableStateOf("")};var status by remember{mutableStateOf("")};MaterialTheme{Surface(Modifier.fillMaxSize()){Column(Modifier.fillMaxSize().padding(24.dp),verticalArrangement=Arrangement.Center){Text("NUMELIXA",style=MaterialTheme.typography.headlineLarge);Spacer(Modifier.height(8.dp));Text("Virtual numbers. Fast, simple, secure.");Spacer(Modifier.height(28.dp));if(!logged){OutlinedTextField(email,{email=it},label={Text("Email")},modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(10.dp));OutlinedTextField(password,{password=it},label={Text("Password")},modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(16.dp));Button(onClick={login(email,password){ok,msg->status=msg;if(ok){logged=true;registerPush()}}},modifier=Modifier.fillMaxWidth()){Text("Sign in")};if(status.isNotBlank()){Spacer(Modifier.height(10.dp));Text(status)}}else{Text("Welcome back",style=MaterialTheme.typography.headlineMedium);Spacer(Modifier.height(16.dp));Text("Your SMS codes, numbers, payments and alerts will appear here.");Spacer(Modifier.height(20.dp));Button(onClick={registerPush()},modifier=Modifier.fillMaxWidth()){Text("Enable notifications")};Spacer(Modifier.height(10.dp));OutlinedButton(onClick={getSharedPreferences(PREFS,MODE_PRIVATE).edit().remove(TOKEN).apply();logged=false},modifier=Modifier.fillMaxWidth()){Text("Sign out")}}}}}}
 private fun login(email:String,password:String,done:(Boolean,String)->Unit){val body=JSONObject().put("email",email).put("password",password).toString().toRequestBody("application/json".toMediaType());HttpClient.post("$API_BASE/api/mobile/login",body,null){success,text->if(!success){done(false,"Unable to sign in");return@post};val token=JSONObject(text).getString("accessToken");getSharedPreferences(PREFS,MODE_PRIVATE).edit().putString(TOKEN,token).apply();runOnUiThread{done(true,"Signed in")}}}
 private fun registerPush(){val token=getSharedPreferences(PREFS,MODE_PRIVATE).getString(TOKEN,null)?:return;FirebaseMessaging.getInstance().token.addOnSuccessListener{fcm->val body=JSONObject().put("token",fcm).put("platform","android").toString().toRequestBody("application/json".toMediaType());HttpClient.post("$API_BASE/api/push/register",body,token){_,_->}}}
}
object HttpClient{private val client=OkHttpClient();fun post(url:String,body:RequestBody,bearer:String?,done:(Boolean,String)->Unit){val b=Request.Builder().url(url).post(body);if(bearer!=null)b.header("Authorization","Bearer $bearer");client.newCall(b.build()).enqueue(object:Callback{override fun onFailure(call:Call,e:IOException){done(false,e.message?:"network error")};override fun onResponse(call:Call,r:Response){r.use{done(it.isSuccessful,it.body?.string()?:"HTTP ${it.code}")}}})}}
