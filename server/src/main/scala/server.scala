package server

import org.scalatra._
import javax.servlet.http.{HttpServletRequest, HttpServletResponse}

class Server extends ScalatraServlet with Jsonp {
  import net.liftweb.json.JsonAST._
  import net.liftweb.json.JsonDSL._

  val rand = new java.util.Random
  var delay: Option[Int] = None

  before {
    contentType = "application/json"
    delay.foreach(d => Thread.sleep(rand.nextInt(d)))
  }

  get("/query/:q") {
    compact(render(Twitter.search(params("q")).take(5))) 
  }

  get("/validateusername/:username") {
    val json: JValue = Usernames.isFree(params("username")) match {
      case true  => ("success" -> true)
      case false => ("success" -> false) ~ ("error" -> "not_unique")
    }
    compact(render(json)) 
  }

  post("/randomdelay/:millis") {
    delay = Some(params("millis").toInt)
  }
}

object Twitter {
  import dispatch._
  import net.liftweb.json.JsonParser
  import net.liftweb.json.JsonAST._

  def search(q: String) = {
    val req = :/("search.twitter.com") / "search.json" <<? Map("q" -> q)
    val json = Http(req >- JsonParser.parse)
    for { JField("text", t) <- json } yield t
  }
}

object Usernames {
  val users = List("joni", "joe")

  def isFree(username: String) = !users.exists(_.equalsIgnoreCase(username))
}

trait Jsonp extends Handler { 
  abstract override def handle(req: HttpServletRequest, res: HttpServletResponse) = {
    val callback = getCallback(req)
    callback.foreach(c => res.getWriter.print(c + "("))
    super.handle(req, res)
    callback.foreach(_ => res.getWriter.print(")"))
  }

  private def getCallback(req: HttpServletRequest) = {
    val callback = req.getParameter("callback")
    if (callback != null) Some(callback) else None
  }
}

