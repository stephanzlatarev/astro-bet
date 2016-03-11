package astrobet;

import java.security.KeyStore;
import java.security.Provider;
import java.security.Security;
import java.security.cert.X509Certificate;

import javax.net.ssl.ManagerFactoryParameters;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactorySpi;
import javax.net.ssl.X509TrustManager;

@SuppressWarnings("serial")
public class NaiveTrustSecurityProvider extends Provider {

  public static NaiveTrustSecurityProvider provider = null;

  public NaiveTrustSecurityProvider() {
    super("Naive Trust Manager", 1, "Trusts all certificates");
    put("TrustManagerFactory.TrustAllCertificates", MyTrustManagerFactory.class.getName());
  }

  public static void install() {
    if (provider == null) {
      provider = new NaiveTrustSecurityProvider();

      Security.addProvider(provider);
      Security.setProperty("ssl.TrustManagerFactory.algorithm", "TrustAllCertificates");
    }

    try {
      SSLContext ctx = SSLContext.getInstance("TLS");
      X509TrustManager tm = new X509TrustManager() {
        public void checkClientTrusted(X509Certificate[] xcs, String string) {
        }

        public void checkServerTrusted(X509Certificate[] xcs, String string) {
        }

        public X509Certificate[] getAcceptedIssuers() {
            return null;
        }
      };
      ctx.init(null, new TrustManager[]{tm}, null);
      SSLContext.setDefault(ctx);
    } catch (Exception ex) {
      ex.printStackTrace();
    }
  }

  public static class MyTrustManagerFactory extends TrustManagerFactorySpi {
    public MyTrustManagerFactory() {
    }

    @Override
    protected void engineInit(KeyStore keystore) {
    }

    @Override
    protected void engineInit(ManagerFactoryParameters mgrparams) {
    }

    @Override
    protected TrustManager[] engineGetTrustManagers() {
      return new TrustManager[] {
          new MyX509TrustManager()
      };
    }
  }

  public static class MyX509TrustManager implements X509TrustManager {
    @Override
    public void checkClientTrusted(X509Certificate[] chain, String authType) {
    }

    @Override
    public void checkServerTrusted(X509Certificate[] chain, String authType) {
    }

    @Override
    public X509Certificate[] getAcceptedIssuers() {
      return null;
    }
  }

}
