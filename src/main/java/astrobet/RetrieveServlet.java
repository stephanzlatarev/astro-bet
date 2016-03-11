package astrobet;

import java.io.IOException;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Text;

@SuppressWarnings("serial")
public class RetrieveServlet extends HttpServlet {

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    try {
      DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
      String json = ((Text) datastore.get(KeyFactory.createKey("mooncycle", request.getParameter("window"))).getProperty("json")).getValue();
      response.getWriter().println(json);
    } catch (EntityNotFoundException e) {
      response.sendError(500, e.toString());
    }
  }
  
}
