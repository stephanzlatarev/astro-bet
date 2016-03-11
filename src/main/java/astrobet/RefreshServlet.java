package astrobet;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Text;

@SuppressWarnings("serial")
public class RefreshServlet extends HttpServlet {

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    final String QUOTES_URL = "https://api-fxpractice.oanda.com/v1/candles?instrument=EUR_USD&granularity=M1&count=1";

    try {
      HttpURLConnection connection = (HttpURLConnection) new URL(QUOTES_URL).openConnection();
      connection.setRequestMethod("GET");
      connection.addRequestProperty("Content-Type", "application/x-www-form-urlencoded");
      connection.addRequestProperty("X-Accept-Datetime-Format", "UNIX");
      connection.addRequestProperty("Authorization", "Bearer 6fec4dc8bf5ed983d77b7783c027bdcd-d16c06e6db690a70916c04909fd51033");

      String candle = getJson(connection.getInputStream());

      if (candle != null) {
        updateData(candle);
      }
    } catch (Exception e) {
      loge("internal server error", e);
      response.sendError(500, e.toString());
    }
  }

  private void updateData(String candle) throws Exception {
    System.out.println("update candle: " + candle);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    String time = candle.substring(0, candle.indexOf(','));
    if (!time.contains("time")) { throw new Exception("unexpected candle format: " + candle); }

    Key key = KeyFactory.createKey("mooncycle", "current");
    try {
      String cycle = ((Text) datastore.get(key).getProperty("json")).getValue();
      int index = cycle.indexOf(time);
      Text newCycle = new Text((index > 0) ? cycle.substring(0, index) + candle + " ]" : cycle.substring(0, cycle.length() - 2) + ", " + candle + " ]");

      Entity entity = new Entity(key);
      entity.setUnindexedProperty("json", newCycle);
      datastore.put(entity);
    } catch (EntityNotFoundException e) {
      Entity entity = new Entity(key);
      entity.setUnindexedProperty("json", new Text("[ " + candle + " ]"));
      datastore.put(entity);
    }
  }

  private String getJson(InputStream in) {
    try {
      String json = "";
      BufferedReader reader = new BufferedReader(new InputStreamReader(in));
      boolean isReading = false;
      String line;

      while ((line = reader.readLine()) != null) {
        if (line.contains("[")) {
          isReading = true;
        } else if (line.contains("]")) {
          break;
        } else if (isReading) {
          json += line.trim();
        }
      }

      return json;
    } catch (Exception e) {
      loge("exception on reading quotes", e);
      return null;
    } finally {
      try {
        in.close();
      } catch (Exception e) {
        loge("exception on closing quotes connection", e);
      }
    }
  }

  private static void loge(String message, Throwable e) {
    String log = message;
    while (e != null) {
      log += ": ";
      log += e.toString();
      e = e.getCause();
    }
    System.out.println(log);
  }

  static {
    try {
      System.setProperty("https.proxyHost", "proxy");
      System.setProperty("https.proxyPort", "8080");
      NaiveTrustSecurityProvider.install();
    } catch (Exception e) {
      loge("not a local environment", e);
    }
  }

}
