package com.ashenroad.sunward;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.os.SystemClock;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.widget.LinearLayout;
import com.google.android.gms.ads.*;
import com.google.android.gms.ads.interstitial.*;
import com.google.android.gms.ads.rewarded.*;
import java.io.IOException;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Locale;
import java.util.Map;
import java.util.Collections;

/** Thin native shell. The offline story engine is packaged in assets; no speech API credentials. */
public class MainActivity extends Activity {
    private WebView web;
    private AdView banner;
    private InterstitialAd interstitial;
    private RewardedAd rewarded;
    private boolean wantsBanner=false, adsReady=false, fullScreen=false;
    private int sessionAds=0;
    private SharedPreferences prefs;
    private final long launched=SystemClock.elapsedRealtime();
    private static final String ORIGIN="https://appassets.androidplatform.net";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        prefs=getSharedPreferences("sunward_native",MODE_PRIVATE);
        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(Color.rgb(246,241,231));
        root.setOnApplyWindowInsetsListener((v,insets)->{
            v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        web=new WebView(this);web.setBackgroundColor(Color.rgb(246,241,231));
        root.addView(web,new LinearLayout.LayoutParams(-1,0,1));
        banner=new AdView(this);banner.setAdUnitId("ca-app-pub-3940256099942544/6300978111");banner.setAdSize(AdSize.BANNER);banner.setVisibility(View.GONE);
        LinearLayout.LayoutParams bannerLayout=new LinearLayout.LayoutParams(-1,(int)(50*getResources().getDisplayMetrics().density));
        root.addView(banner,bannerLayout);setContentView(root);
        web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
        web.getSettings().setTextZoom(100);
        // Assets ship inside the APK; never serve stale assets after an app update.
        web.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_NO_CACHE);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web.addJavascriptInterface(new Bridge(),"SunwardNative");
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !r.getUrl().toString().startsWith(ORIGIN+"/");}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
                if(!"appassets.androidplatform.net".equals(r.getUrl().getHost()))return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),null);
                String path=r.getUrl().getPath();
                if(path==null||path.contains(".."))return null;
                if(path.equals("/"))path="/index.html";
                String mime="application/octet-stream";
                if(path.endsWith(".html"))mime="text/html";else if(path.endsWith(".mjs")||path.endsWith(".js"))mime="text/javascript";else if(path.endsWith(".css"))mime="text/css";else if(path.endsWith(".svg"))mime="image/svg+xml";else if(path.endsWith(".webp"))mime="image/webp";else if(path.endsWith(".png"))mime="image/png";else if(path.endsWith(".mp3"))mime="audio/mpeg";else if(path.endsWith(".mp4"))mime="video/mp4";else if(path.endsWith(".ogg"))mime="audio/ogg";else if(path.endsWith(".wav"))mime="audio/wav";else if(path.endsWith(".json"))mime="application/json";else if(path.endsWith(".woff2"))mime="font/woff2";
                try{
                    if(mime.startsWith("audio/")||mime.startsWith("video/"))return mediaResponse(path.substring(1),mime,r.getRequestHeaders());
                    return new WebResourceResponse(mime,"UTF-8",200,"OK",Collections.singletonMap("Cache-Control","public, max-age=31536000"),getAssets().open(path.substring(1)));
                }
                catch(IOException e){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),null);}
            }
        });
        web.loadUrl(ORIGIN+"/index.html");
        new Thread(()->MobileAds.initialize(this,status->runOnUiThread(()->{
            if(isFinishing()||isDestroyed())return;
            adsReady=true;banner.loadAd(new AdRequest.Builder().build());banner.setVisibility(wantsBanner?View.VISIBLE:View.GONE);loadInterstitial();loadRewarded();
        }))).start();
    }
    /** Seekable packaged media: duration and loops work offline in Android WebView. */
    private WebResourceResponse mediaResponse(String path,String mime,Map<String,String> requestHeaders)throws IOException {
        byte[] bytes;
        try(InputStream input=getAssets().open(path);ByteArrayOutputStream output=new ByteArrayOutputStream()){
            byte[] chunk=new byte[8192];int read;while((read=input.read(chunk))!=-1)output.write(chunk,0,read);bytes=output.toByteArray();
        }
        Map<String,String> headers=new HashMap<>();headers.put("Accept-Ranges","bytes");headers.put("Cache-Control","no-store");
        String range=null;for(Map.Entry<String,String> header:requestHeaders.entrySet())if("Range".equalsIgnoreCase(header.getKey()))range=header.getValue();
        int start=0,end=bytes.length-1,status=200;String reason="OK";
        if(range!=null){
            Matcher match=Pattern.compile("bytes=(\\d+)-(\\d*)").matcher(range);
            boolean valid=match.matches();
            if(valid){try{start=Integer.parseInt(match.group(1));if(!match.group(2).isEmpty())end=Math.min(Integer.parseInt(match.group(2)),end);}catch(NumberFormatException e){valid=false;}}
            if(!valid||start>=bytes.length||end<start){headers.put("Content-Range","bytes */"+bytes.length);return new WebResourceResponse(mime,null,416,"Range Not Satisfiable",headers,new ByteArrayInputStream(new byte[0]));}
            status=206;reason="Partial Content";headers.put("Content-Range","bytes "+start+"-"+end+"/"+bytes.length);
        }
        headers.put("Content-Length",String.valueOf(end-start+1));
        return new WebResourceResponse(mime,null,status,reason,headers,new ByteArrayInputStream(bytes,start,end-start+1));
    }
    private void js(String script){if(web!=null&&!isDestroyed())web.evaluateJavascript(script,null);}
    private void loadInterstitial(){
        if(!adsReady)return;
        InterstitialAd.load(this,"ca-app-pub-3940256099942544/1033173712",new AdRequest.Builder().build(),new InterstitialAdLoadCallback(){
            @Override public void onAdLoaded(InterstitialAd ad){interstitial=ad;}
            @Override public void onAdFailedToLoad(LoadAdError error){interstitial=null;}
        });
    }
    private void loadRewarded(){
        if(!adsReady)return;
        RewardedAd.load(this,"ca-app-pub-3940256099942544/5224354917",new AdRequest.Builder().build(),new RewardedAdLoadCallback(){
            @Override public void onAdLoaded(RewardedAd ad){rewarded=ad;}
            @Override public void onAdFailedToLoad(LoadAdError error){rewarded=null;}
        });
    }
    private FullScreenContentCallback callbacks(boolean reward){return new FullScreenContentCallback(){
        @Override public void onAdShowedFullScreenContent(){fullScreen=true;js("window.nativeAudioPause?.()");}
        @Override public void onAdDismissedFullScreenContent(){fullScreen=false;if(reward){js("window.nativeRewardClosed?.()");loadRewarded();}else{js("window.nativeChapterClosed?.()");loadInterstitial();}}
        @Override public void onAdFailedToShowFullScreenContent(AdError error){fullScreen=false;if(reward){js("window.nativeReward?.('unavailable')");loadRewarded();}else{js("window.nativeChapterClosed?.()");loadInterstitial();}}
    };}
    private class Bridge {
        private boolean storageKey(String key){
            if(key==null)return false;
            switch(key){
                case "sunward.save.v1":case "sunward.backup.v1":case "sunward.checkpoint.v1":
                case "sunward.prefs":case "sunward.endings":case "sunward.onboard":
                case "sunward.memories":case "sunward.awards":case "sunward.codex":return true;
                default:return false;
            }
        }
        @JavascriptInterface public String readStorage(String key){return storageKey(key)?prefs.getString("web:"+key,null):null;}
        @JavascriptInterface public boolean writeStorage(String key,String value){
            return storageKey(key)&&value!=null&&value.length()<=262144&&prefs.edit().putString("web:"+key,value).commit();
        }
        @JavascriptInterface public String language(){return Locale.getDefault().getLanguage();}
        @JavascriptInterface public void banner(boolean show){runOnUiThread(()->{wantsBanner=show;banner.setVisibility(show&&adsReady?View.VISIBLE:View.GONE);});}
        @JavascriptInterface public void chapter(int chapter){runOnUiThread(()->{
            long now=System.currentTimeMillis(),last=prefs.getLong("last_ad",0);
            // Natural breaks only: every second chapter, >=180 seconds apart, maximum two per session.
            if(chapter>0&&chapter%2==0&&sessionAds<2&&now-last>=180000&&SystemClock.elapsedRealtime()-launched>=60000&&interstitial!=null&&!fullScreen){
                InterstitialAd ad=interstitial;interstitial=null;sessionAds++;prefs.edit().putLong("last_ad",now).apply();ad.setFullScreenContentCallback(callbacks(false));ad.show(MainActivity.this);
            }else{js("window.nativeChapterClosed?.()");if(interstitial==null)loadInterstitial();}
        });}
        @JavascriptInterface public void reward(){runOnUiThread(()->{
            if(rewarded==null||fullScreen){js("window.nativeReward?.('unavailable')");loadRewarded();return;}
            RewardedAd ad=rewarded;rewarded=null;ad.setFullScreenContentCallback(callbacks(true));ad.show(MainActivity.this,item->js("window.nativeReward?.('earned')"));
        });}
        @JavascriptInterface public void share(){runOnUiThread(()->{
            Intent send=new Intent(Intent.ACTION_SEND);send.setType("text/plain");send.putExtra(Intent.EXTRA_TEXT,"Sunward Oath — a bright sword & sorcery adventure. Find Mira. Choose who you trust.\nhttps://github.com/fareza777/sword-sorcery-sol/releases");startActivity(Intent.createChooser(send,"Share Sunward Oath"));
        });}
        @JavascriptInterface public void rate(){runOnUiThread(()->new AlertDialog.Builder(MainActivity.this).setTitle("Sunward Oath").setMessage("Ratings will be available when Sunward Oath launches on Google Play. Thank you for playing this independent edition.").setPositiveButton("OK",null).show());}
    }
    @Override public void onBackPressed(){js("window.nativeBack?.()");}
    @Override protected void onPause(){super.onPause();if(web!=null)js("window.nativeAudioPause?.()");if(banner!=null)banner.pause();}
    @Override protected void onResume(){super.onResume();if(banner!=null)banner.resume();}
    @Override protected void onDestroy(){if(banner!=null)banner.destroy();if(web!=null){web.removeJavascriptInterface("SunwardNative");web.destroy();web=null;}super.onDestroy();}
}
