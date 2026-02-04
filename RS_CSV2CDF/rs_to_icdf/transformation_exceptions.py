class MissingParticipantRowException(Exception):
    def __init__(self, base_exception:Exception):
        self.base_exception = base_exception
        super().__init__()



class MoreThanOneValueInAssessmentVariants(Exception):
    def __init__(self, message:str):
        self.message = message
        super().__init__(message)        