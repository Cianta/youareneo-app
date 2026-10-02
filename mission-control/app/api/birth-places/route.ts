import {findBirthPlaces} from "@/lib/workspace/places";
import {json} from "@/lib/auth/http";
export async function GET(req:Request){return json({places:findBirthPlaces(new URL(req.url).searchParams.get("q")??"")});}
