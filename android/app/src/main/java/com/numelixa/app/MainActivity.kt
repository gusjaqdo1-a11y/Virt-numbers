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
private const val API_BASE="https://numelixa.com";private const val PREFS="numelixa";private const val TOKEN="access_token"
class MainActivity:ComponentActivity(){
 private val permissionLauncher=registerForActivityResult(ActivityResultContracts.RequestPermission()){}
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);createNotificationChannel();if(Build.VERSION.SDK_INT>=33&&ContextCompat.checkSelfPermission(this,Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);setContent{NumelixaApp()}}
 private fun createNotificationChannel(){if(Build.VERSION.SDK_INT>=26){val c=NotificationChannel("numelixa","Numelixa notifications",NotificationManager.IMPORTANCE_HIGH).apply{description="SMS codes, orders and payment updates"};getSystemService(NotificationManager::class.java).createNotificationChannel(c)}}
 @Composable fun NumelixaApp(){var logged by remember{mutableStateOf(getSharedPreferences(PREFS,MODE_PRIVATE).getString(TOKEN,null)!=null)};var email by remember{mutableStateOf("")};var password by remember{mutableStateOf("")};var status by remember{mutableStateOf("")};var balance by remember{mutableStateOf(0.0)};val services=remember{mutableStateListOf<Pair<String,String>>()};val orders=remember{mutableStateListOf<String>()}
  fun load(){val token=getSharedPreferences(PREFS,MODE_PRIVATE).getString(TOKEN,null)?:return;HttpClient.get("$API_BASE/api/mobile/bootstrap",token){ok,text->if(ok){val o=JSONObject(text);balance=o.getJSONObject("user").optDouble("balance",0.0);services.clear();val cs=o.getJSONArray("countries");for(i in 0 until cs.length()){val c=cs.getJSONObject(i);val ss=c.getJSONArray("services");for(j in 0 until ss.length()){val s=ss.getJSONObject(j);services.add(Pair(s.getString("id"),"${c.getString("name")} • ${s.getString("name")} • $${s.getDouble("basePrice")}"))}};orders.clear();val os=o.getJSONArray("orders");for(i in 0 until os.length()){val x=os.getJSONObject(i);orders.add("${x.optString("phoneNumber")} • ${x.optString("status")}")};runOnUiThread{status=""}}else runOnUiThread{status="Unable to load dashboard"}}}
  fun buy(id:String){val token=getSharedPreferences(PREFS,MODE_PRIVATE).getString(TOKEN,null)?:return;val body=JSONObject().put("serviceId",id).toString().toRequestBody("application/json".toMediaType());HttpClient.post("$API_BASE/api/mobile/order",body,token){ok,text->runOnUiThread{status=if(ok)"Number purchased successfully" else try{JSONObject(text).getJSONObject("error").getString("message")}catch(_:Exception){"Purchase failed"};if(ok)load()}}}
  LaunchedEffect(logged){if(logged){registerPush();load()}}
  MaterialTheme{Surface(Modifier.fillMaxSize()){Column(Modifier.fillMaxSize().padding(20.dp)){Text("NUMELIXA",style=MaterialTheme.typography.headlineLarge);Spacer(Modifier.height(8.dp));if(!logged){Text("Virtual numbers. Fast, simple, secure.");Spacer(Modifier.height(22.dp));OutlinedTextField(email,{email=it},label={Text("Email")},modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(10.dp));OutlinedTextField(password,{password=it},label={Text("Password")},modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(16.dp));Button(onClick={login(email,password){ok,msg->status=msg;if(ok)logged=true}},modifier=Modifier.fillMaxWidth()){Text("Sign in")}}else{Text("Balance $${"%.2f".format(balance)}",style=MaterialTheme.typography.headlineSmall);Spacer(Modifier.height(18.dp));Text("Buy a number",style=MaterialTheme.typography.titleLarge);services.take(8).forEach{(id,label)->Row(Modifier.fillMaxWidth().padding(vertical=5.dp),horizontalArrangement=Arrangement.SpaceBetween){Text(label,modifier=Modifier.weight(1f));Button(onClick={buy(id)}){Text("Buy")}}};Spacer(Modifier.height(12.dp));Text("Active / recent orders",style=MaterialTheme.typography.titleLarge);orders.take(8).forEach{Text(it,modifier=Modifier.padding(vertical=4.dp))};Spacer(Modifier.height(12.dp));Button(onClick={registerPush()},modifier=Modifier.fillMaxWidth()){Text("Enable notifications")};Spacer(Modifier.height(8.dp));OutlinedButton(onClick={getSharedPreferences(PREFS,MODE_PRIVATE).edit().remove(TOKEN).apply();logged=false},modifier=Modifier.fillMaxWidth()){Text("Sign out")}};if(status.isNotBlank()){Spacer(Modifier.height(8.dp));Text(status)}}}}
 }
 private fun login(email:String,password:String,done:(Boolean,String)->Unit){val body=JSONObject().put("email",email).put("password",password).toString().toRequestBody("application/json".toMediaType());HttpClient.post("$API_BASE/api/mobile/login",body,null){success,text->if(!success){runOnUiThread{done(false,"Unable to sign in")};return@post};val token=JSONObject(text).getString("accessToken");getSharedPreferences(PREFS,MODE_PRIVATE).edit().putString(TOKEN,token).apply();runOnUiThread{done(true,"Signed in")}}}
 private fun registerPush(){val token=getSharedPreferences(PREFS,MODE_PRIVATE).getString(TOKEN,null)?:return;FirebaseMessaging.getInstance().token.addOnSuccessListener{fcm->val body=JSONObject().put("token",fcm).put("platform","android").toString().toRequestBody("application/json".toMediaType());HttpClient.post("$API_BASE/api/push/register",body,token){_,_->}}}
}
object HttpClient{private val client=OkHttpClient();fun post(url:String,body:RequestBody,bearer:String?,done:(Boolean,String)->Unit){val b=Request.Builder().url(url).post(body);if(bearer!=null)b.header("Authorization","Bearer $bearer");client.newCall(b.build()).enqueue(object:Callback{override fun onFailure(call:Call,e:IOException){done(false,e.message?:"network error")};override fun onResponse(call:Call,r:Response){r.use{done(it.isSuccessful,it.body?.string()?:"HTTP ${it.code}")}}})};fun get(url:String,bearer:String,done:(Boolean,String)->Unit){val b=Request.Builder().url(url).get().header("Authorization","Bearer $bearer");client.newCall(b.build()).enqueue(object:Callback{override fun onFailure(call:Call,e:IOException){done(false,e.message?:"network error")};override fun onResponse(call:Call,r:Response){r.use{done(it.isSuccessful,it.body?.string()?:"HTTP ${it.code}")}}})}}
